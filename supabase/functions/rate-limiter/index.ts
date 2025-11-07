import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RateLimitConfig {
  endpoint: string;
  requestsPerMinute: number;
  requestsPerHour: number;
}

// Rate limit configurations per role
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  admin: {
    endpoint: "*",
    requestsPerMinute: 1000,
    requestsPerHour: 50000,
  },
  premium: {
    endpoint: "*",
    requestsPerMinute: 100,
    requestsPerHour: 5000,
  },
  user: {
    endpoint: "*",
    requestsPerMinute: 30,
    requestsPerHour: 1000,
  },
  anonymous: {
    endpoint: "*",
    requestsPerMinute: 10,
    requestsPerHour: 100,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    let userRole = "anonymous";

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        userId = user.id;
        
        // Fetch user role
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .order("role", { ascending: false }) // admin > premium > user
          .limit(1);

        if (roles && roles.length > 0) {
          userRole = roles[0].role;
        } else {
          userRole = "user"; // Default role
        }
      }
    }

    // Get request details
    const { endpoint } = await req.json();
    const clientIP = req.headers.get("x-forwarded-for") || 
                     req.headers.get("x-real-ip") || 
                     "unknown";

    console.log(`🔐 Rate limit check: user=${userId || 'anonymous'}, role=${userRole}, ip=${clientIP}, endpoint=${endpoint}`);

    // Get rate limit config for user role
    const config = RATE_LIMITS[userRole] || RATE_LIMITS.anonymous;

    // Check rate limits
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Query recent requests
    let query = supabase
      .from("api_rate_limits")
      .select("request_count, window_start")
      .eq("endpoint", endpoint)
      .gte("window_start", oneHourAgo.toISOString());

    if (userId) {
      query = query.eq("user_id", userId);
    } else {
      query = query.eq("ip_address", clientIP);
    }

    const { data: recentRequests, error: queryError } = await query;

    if (queryError) {
      console.error("❌ Error querying rate limits:", queryError);
      throw new Error("Failed to check rate limits");
    }

    // Calculate requests in last minute and hour
    let requestsLastMinute = 0;
    let requestsLastHour = 0;

    recentRequests?.forEach((record) => {
      const windowStart = new Date(record.window_start);
      requestsLastHour += record.request_count;
      
      if (windowStart >= oneMinuteAgo) {
        requestsLastMinute += record.request_count;
      }
    });

    console.log(`📊 Current usage: ${requestsLastMinute}/${config.requestsPerMinute} per minute, ${requestsLastHour}/${config.requestsPerHour} per hour`);

    // Check if rate limit exceeded
    const isLimitExceeded = 
      requestsLastMinute >= config.requestsPerMinute ||
      requestsLastHour >= config.requestsPerHour;

    if (isLimitExceeded) {
      console.log("🚫 Rate limit exceeded!");
      return new Response(
        JSON.stringify({
          allowed: false,
          message: "Rate limit exceeded",
          limits: {
            perMinute: config.requestsPerMinute,
            perHour: config.requestsPerHour,
          },
          current: {
            lastMinute: requestsLastMinute,
            lastHour: requestsLastHour,
          },
          retryAfter: 60, // seconds
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Record this request
    const { error: insertError } = await supabase
      .from("api_rate_limits")
      .insert({
        user_id: userId,
        ip_address: clientIP,
        endpoint: endpoint,
        request_count: 1,
        window_start: now.toISOString(),
      });

    if (insertError) {
      console.error("❌ Error recording rate limit:", insertError);
    }

    console.log("✅ Rate limit check passed");

    return new Response(
      JSON.stringify({
        allowed: true,
        limits: {
          perMinute: config.requestsPerMinute,
          perHour: config.requestsPerHour,
        },
        current: {
          lastMinute: requestsLastMinute + 1,
          lastHour: requestsLastHour + 1,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Rate limiter error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
