import os
from dotenv import load_dotenv
from django.urls import path
# from . import views # Descomente quando tiver views

# Carrega as variáveis de ambiente do arquivo .env na raiz do projeto.
# Nota: Geralmente, isso é feito no arquivo principal settings.py do Django.
load_dotenv()

# Acessa a chave de API a partir das variáveis de ambiente.
CHATGPT_API_KEY = os.getenv("sk-proj-8N6xXQIg7PlU-SEs-Mf8nCcBMYMsBswKztrZgWmZattFmM3HzOMqpQQ546wNtzg-TLEiYdL4WvT3BlbkFJfykGFcLs-zJJ0aCNQnWC3gOCwiTQ0HHFtVipZ3iBCn")

# Padrões de URL para o seu aplicativo. Você pode adicionar suas rotas aqui.
urlpatterns = [
    # Exemplo:
    # path('sua-rota/', views.sua_view, name='sua-view'),
]

# Opcional: Imprime uma mensagem no console para confirmar que a chave foi carregada
# quando o servidor de desenvolvimento do Django é iniciado.
if CHATGPT_API_KEY:
    print("Chave de API do ChatGPT carregada com sucesso a partir de urls.py.")
else:
    print("AVISO: A chave de API do ChatGPT não foi encontrada. Verifique o arquivo .env e seu nome.")
