import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Key, Trash2, Eye, EyeOff, Plus, Activity, Zap, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ApiKey {
  id: string;
  key_prefix: string;
  name: string;
  status: string;
  created_at: string;
  last_used_at: string | null;
}

interface Subscription {
  tier: string;
  status: string;
  current_period_end: string | null;
}

interface UsageStats {
  total_requests: number;
  requests_this_month: number;
  limit: number;
  percentage: number;
}

const ApiDashboard = () => {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Carregar API keys
      const { data: keys, error: keysError } = await supabase
        .from("api_keys")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (keysError) throw keysError;
      setApiKeys(keys || []);

      // Carregar assinatura
      const { data: sub, error: subError } = await supabase
        .from("user_subscriptions")
        .select("tier, status, current_period_end")
        .eq("user_id", user?.id)
        .single();

      if (subError && subError.code !== "PGRST116") throw subError;
      setSubscription(sub);

      // Carregar estatísticas de uso
      const { data: plan } = await supabase
        .from("subscription_plans")
        .select("max_requests_per_month")
        .eq("tier", sub?.tier || "free")
        .single();

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: usage } = await supabase
        .from("api_usage")
        .select("id")
        .eq("user_id", user?.id)
        .gte("request_time", startOfMonth.toISOString());

      const requestsThisMonth = usage?.length || 0;
      const limit = plan?.max_requests_per_month || 1000;

      setUsageStats({
        total_requests: requestsThisMonth,
        requests_this_month: requestsThisMonth,
        limit,
        percentage: (requestsThisMonth / limit) * 100,
      });
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error("Erro ao carregar dados do dashboard");
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error("Por favor, dê um nome para a API key");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("generate-api-key", {
        body: { name: newKeyName },
      });

      if (error) throw error;

      setGeneratedKey(data.api_key);
      setShowKey(true);
      setNewKeyName("");
      toast.success("API Key gerada com sucesso!");
      loadDashboardData();
    } catch (error) {
      console.error("Error generating API key:", error);
      toast.error("Erro ao gerar API key");
    }
  };

  const deleteApiKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from("api_keys")
        .delete()
        .eq("id", keyId);

      if (error) throw error;

      toast.success("API Key deletada com sucesso");
      loadDashboardData();
    } catch (error) {
      console.error("Error deleting API key:", error);
      toast.error("Erro ao deletar API key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  const getTierBadge = (tier: string) => {
    const colors = {
      free: "bg-slate-500",
      pro: "bg-primary",
      enterprise: "bg-purple-600",
    };
    return colors[tier as keyof typeof colors] || "bg-slate-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="animate-pulse">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              API Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie suas API keys e monitore o uso
            </p>
          </div>
          <Badge className={getTierBadge(subscription?.tier || "free")}>
            {subscription?.tier?.toUpperCase() || "FREE"}
          </Badge>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Requisições este mês
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usageStats?.requests_this_month || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  de {usageStats?.limit.toLocaleString()} disponíveis
                </p>
                <div className="w-full bg-muted rounded-full h-2 mt-3">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(usageStats?.percentage || 0, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">API Keys Ativas</CardTitle>
                <Key className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{apiKeys.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {apiKeys.filter((k) => k.status === "active").length} em uso
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Uso</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usageStats?.percentage.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  do limite mensal
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Generate New Key */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Gerar Nova API Key
              </CardTitle>
              <CardDescription>
                Crie uma nova chave para autenticar suas requisições
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="keyName">Nome da Key</Label>
                  <Input
                    id="keyName"
                    placeholder="Ex: Produção, Desenvolvimento..."
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={generateApiKey}>
                    <Plus className="h-4 w-4 mr-2" />
                    Gerar Key
                  </Button>
                </div>
              </div>

              {generatedKey && showKey && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-4 bg-muted rounded-lg space-y-2"
                >
                  <p className="text-sm font-medium text-destructive">
                    ⚠️ Copie esta chave agora! Ela não será mostrada novamente.
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-background rounded text-sm">
                      {generatedKey}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(generatedKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* API Keys List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Suas API Keys</CardTitle>
              <CardDescription>
                Gerencie e visualize suas chaves de API existentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {apiKeys.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma API key criada ainda
                </p>
              ) : (
                <div className="space-y-4">
                  {apiKeys.map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{key.name}</h3>
                          <Badge
                            variant={key.status === "active" ? "default" : "secondary"}
                          >
                            {key.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          <code>{key.key_prefix}••••••••••••</code>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Criada em {new Date(key.created_at).toLocaleDateString("pt-BR")}
                          {key.last_used_at &&
                            ` • Último uso: ${new Date(key.last_used_at).toLocaleDateString("pt-BR")}`}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => deleteApiKey(key.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ApiDashboard;
