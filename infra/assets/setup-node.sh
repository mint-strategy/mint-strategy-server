set -eux

export INSTALL_K3S_VERSION=v1.22.9+k3s1
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
export CERT_MGR_VER=v1.8.0

apt update
apt upgrade -y
apt install -y ca-certificates curl gnupg lsb-release

curl -sfL https://get.k3s.io | sh -

curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

mkdir ~admin/.kube
k3s kubectl config view --raw > ~admin/.kube/config
chmod -R go-rx ~admin/.kube/
chown -R admin.admin ~admin/.kube

## Add the Jetstack Helm repository
helm repo add jetstack https://charts.jetstack.io

## Update your local Helm chart repository cache
helm repo update

helm install cert-manager jetstack/cert-manager   --namespace cert-manager   --create-namespace   --version $CERT_MGR_VER   --set installCRDs=true

#helm repo add rancher-stable https://releases.rancher.com/server-charts/stable
#
#kubectl create namespace cattle-system
#
#
#kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.8.0/cert-manager.yaml
#
#helm install rancher rancher-stable/rancher \
#  --namespace cattle-system \
#  --set hostname=mint.dev.oeklo.at \
#  --set bootstrapPassword=GoGevv6MlF \
#  --set ingress.tls.source=letsEncrypt \
#  --set letsEncrypt.email=it@oeklo.at \
#  --set letsEncrypt.ingress.class=traefik