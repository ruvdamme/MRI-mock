## 1. MRI Setup

### 1.1 Installation

For Windows OS - Command Prompt

#### 1.1.1 Docker

Download [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/).

#### 1.1.2 Minikube

`winget install Kubernetes.minikube`

#### 1.1.3 kubectl

`winget install Kubernetes.kubectl`

#### 1.1.4 Helm

`winget install Helm.Helm`

#### 1.1.5 Node.js

Download [Node.js](https://nodejs.org/en/download) (.msi).

### 1.2 Start Minikube

Launch Docker Desktop.

```
minikube start --driver=docker --memory=4096 --cpus=2
minikube addons enable metrics-server
```

If you want to persist the minikube config so you can just type `minikube start` (see 1.5 Quick Restart):

```
minikube config set driver docker
minikube config set memory 4096
minikube config set cpus 2
```

`kubectl get nodes`

### 1.3 Deploy to Kubernetes

#### 1.3.1 Build Docker Images

```
cd services/auth-service && docker build -t auth-service:latest . && cd ../..
cd services/api-service && docker build -t api-service:latest . && cd ../..
cd services/db-service && docker build -t db-service:latest . && cd ../..
```

By default, Docker build images on the machine, but not inside Minikube. Load them.

```
minikube image load auth-service:latest
minikube image load api-service:latest
minikube image load db-service:latest
```

`minikube image ls`

#### 1.3.2 Apply the Manifests

```
kubectl apply -f k8s/
```

`kubectl get pods`

### 1.4 Prometheus

#### 1.4.1 Add the Prometheus Helm chart

```
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
```

#### 1.4.2 Install Prometheus into Minikube

```
helm install prometheus prometheus-community/prometheus --set server.service.type=NodePort --set alertmanager.enabled=false
```

`kubectl get pods -l app.kubernetes.io/name=prometheus`

`minikube service prometheus-server --url`

### 1.5 Quick Restart

Launch Docker Desktop.

`minikube start`