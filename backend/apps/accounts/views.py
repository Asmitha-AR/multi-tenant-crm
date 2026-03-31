from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.views import APIView

from apps.accounts.serializers import CustomTokenObtainPairSerializer, UserSerializer
from apps.core.api import api_success


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return api_success(UserSerializer(request.user).data, message="Current user")

