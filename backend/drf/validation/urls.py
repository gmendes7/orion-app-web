from django.urls import path
from .views import ValidateSignatureView

urlpatterns = [
    path('validate-signature/', ValidateSignatureView.as_view(), name='validate-signature'),
]
