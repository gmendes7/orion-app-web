from rest_framework import serializers

class ValidateSignatureSerializer(serializers.Serializer):
    message = serializers.CharField()
    signature = serializers.CharField()
    pubkey = serializers.CharField()
