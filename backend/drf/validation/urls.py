<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
import os
from dotenv import load_dotenv
from django.urls import path
# from . import views # Descomente quando tiver views

# Carrega as variáveis de ambiente do arquivo .env na raiz do projeto.
# Nota: Geralmente, isso é feito no arquivo principal settings.py do Django.
# É importante que o arquivo .env contenha a linha: OPENAI_API_KEY=sk-sua-nova-chave-aqui
load_dotenv()

# Acessa a chave de API a partir das variáveis de ambiente.
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Padrões de URL para o seu aplicativo. Você pode adicionar suas rotas aqui.
urlpatterns = [
    # Exemplo:
    # path('sua-rota/', views.sua_view, name='sua-view'),
]

# Opcional: Imprime uma mensagem no console para confirmar que a chave foi carregada.
# ATENÇÃO: Mover essa lógica de `urls.py` para `settings.py` ou para as views é a prática recomendada em Django.
if OPENAI_API_KEY:
    print("Chave de API da OpenAI carregada com sucesso.")
else:
    print("AVISO: A variável de ambiente OPENAI_API_KEY não foi encontrada. Verifique seu arquivo .env.")
=======
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
from django.urls import path
from .views import ValidateSignatureView

urlpatterns = [
    path('validate-signature/', ValidateSignatureView.as_view(), name='validate-signature'),
]
<<<<<<< Updated upstream
<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
