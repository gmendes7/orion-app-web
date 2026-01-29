from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticatedOrReadOnly

from libs.cpp.validation.python_wrapper.validate_ctypes import verify_signature

class ValidateSignatureView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def post(self, request):
        message = request.data.get('message')
        signature = request.data.get('signature')
        pubkey = request.data.get('pubkey')

        if not message or not signature or not pubkey:
            return Response({'error': 'missing_fields'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            ok = verify_signature(message, signature, pubkey)
            return Response({'valid': ok})
        except RuntimeError as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
