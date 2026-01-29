Django REST Framework — configuração mínima e exemplos

1. Instalação

pip install django djangorestframework django-cors-headers djangorestframework-simplejwt

2. Estrutura sugerida

myproject/
├── manage.py
├── myproject/
│ ├── settings.py
│ └── urls.py
└── votes/
├── models.py
├── serializers.py
├── views.py
└── urls.py

3. Exemplo de `models.py` (votes)

```python
from django.db import models

class Vote(models.Model):
    deputy_id = models.CharField(max_length=64)
    session_id = models.CharField(max_length=64)
    vote_value = models.BooleanField()
    created_at = models.DateTimeField(auto_now_add=True)
    signature = models.BinaryField(null=True, blank=True)  # assinatura para validação
```

4. `serializers.py`

```python
from rest_framework import serializers
from .models import Vote

class VoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vote
        fields = '__all__'
```

5. `views.py` (ViewSet)

```python
from rest_framework import viewsets
from .models import Vote
from .serializers import VoteSerializer

class VoteViewSet(viewsets.ModelViewSet):
    queryset = Vote.objects.all().order_by('-created_at')
    serializer_class = VoteSerializer
```

6. `urls.py` (app)

```python
from rest_framework import routers
from .views import VoteViewSet

router = routers.DefaultRouter()
router.register(r'votes', VoteViewSet)

urlpatterns = router.urls
```

7. Real-time / validação em tempo-real

- Para streaming de votos e validação em tempo real, usar Django Channels (WebSocket) ou um serviço separado em Node/Rust que recebe o stream e processa.

8. Segurança

- Proteja endpoints com JWTs e roles (djangorestframework-simplejwt).
- Valide assinatura dos votos via FFI para C++/Rust se a assinatura for gerada pelo hardware da Câmara.

# Django REST Framework — Validation integration

This folder contains a small DRF view to validate signatures using the native C library built in `libs/cpp/validation`.

1. Add the app urls into your project `myproject/urls.py`:

```py
from django.urls import path, include

urlpatterns = [
    # ...
    path('api/validation/', include('backend.drf.validation.urls')),
]
```

2. Ensure Python can import the `libs.cpp.validation.python_wrapper` package. You may need to add the project root to `PYTHONPATH` in your WSGI/ASGI configuration or install the package.

3. Build the native library before starting the Django server:

```bash
cd libs/cpp/validation
mkdir -p build
cmake -S . -B build
cmake --build build -- -j$(nproc)
```

4. Example request:

POST /api/validation/validate-signature/

```json
{
  "message": "...",
  "signature": "base64sig",
  "pubkey": "base64pub"
}
```
