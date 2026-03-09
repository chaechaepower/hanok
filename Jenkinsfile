pipeline {
    agent any

    environment {
        IMAGE_NAME = 'hanok-backend'
        CONTAINER_NAME = 'hanok-backend-prod'
        COMPOSE_FILE = 'infra/docker-compose.yaml'
        ENV_FILE = 'infra/.env.prod'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            steps {
                dir('be') {
                    sh 'chmod +x gradlew'
                    sh './gradlew bootJar -x test --no-daemon'
                }
            }
        }

        stage('Docker Build') {
            steps {
                dir('be') {
                    sh "docker build -t ${IMAGE_NAME}:prod ."
                }
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    cp /var/jenkins_home/env/.env.prod infra/.env.prod
                    docker compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} up -d --no-deps backend-prod
                '''
            }
        }
    }

    post {
        success {
            echo '배포 성공!'
        }
        failure {
            echo '배포 실패!'
        }
    }
}