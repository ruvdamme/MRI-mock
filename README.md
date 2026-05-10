# 1. MRI Setup

## 1.1 Installation

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

## 1.2 Start Minikube

Launch Docker Desktop.

```
minikube start --driver=docker --memory=4096 --cpus=2
minikube addons enable metrics-server
```

(Optional) if you want to persist the minikube config so you can just type `minikube start` (see 1.5 Quick Restart):

```
minikube config set driver docker
minikube config set memory 4096
minikube config set cpus 2
```

`kubectl get nodes`

## 1.3 Deploy to Kubernetes

#### 1.3.1 Build Docker Images

```
minikube image build -t auth-service:v1 ./services/auth-service
minikube image build -t api-service:v1 ./services/api-service
minikube image build -t db-service:v1 ./services/db-service
```

`minikube image ls`

#### 1.3.2 Apply the Manifests

```
kubectl apply -f k8s/
```

`kubectl get pods`

## 1.4 Prometheus

#### 1.4.1 Add the Prometheus Helm chart

```
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
```

#### 1.4.2 Install Prometheus into Minikube

```
helm install prometheus prometheus-community/prometheus --set alertmanager.enabled=false
```

`kubectl get pods -l app.kubernetes.io/name=prometheus`

## 1.4.3 Port Forwarding

Inside the cluster, prometheus uses a static port. However, as the mri-console is outisde the cluster it has no way in. We could use NodePort but is gives a different port each time. Better to stay at ClusterIP, but set up port-forwarding.

`kubectl port-forward svc/prometheus-server 9090:80`

## 1.4.4 (optional) Value Scraping Params

Even though the values are updated every 5s, prometheus only collects them every 30s by default.
This causes the MRI console to also only get a new value every 30s.
To change this run following upgrade. The prometheus pod will restart automatically.

`helm upgrade prometheus prometheus-community/prometheus -f services/prometheus-values.yaml`

## 1.5 Quick Restart

Launch Docker Desktop.

`minikube start`

## 1.6 Service Update

Here you see an example of how to reload the database service after you made a change.

```
minikube image build -t db-service:v2 ./services/db-service
kubectl set image deployment/db-service db-service=db-service:v2
```

You can watch the pods live using:

`kubectl get pods -w`

# 2. Developer Console Setup

```
npm install
npm run dev
```
