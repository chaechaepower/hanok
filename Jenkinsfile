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

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('sonarqube') {
                    dir('be') {
                        sh './gradlew sonar --no-daemon \
                            -Dsonar.projectKey=hanok \
                            -Dsonar.projectName=hanok \
                            -Dsonar.host.url=http://j14d105.p.ssafy.io:9000'
                    }
                }
            }
        }

        stage('Docker Build') {
            when {
                branch 'master'
            }
            steps {
                dir('be') {
                    sh "docker build -t ${IMAGE_NAME}:prod ."
                }
            }
        }

        stage('Deploy') {
            when {
                branch 'master'
            }
            steps {
                sh '''
                    cp /var/jenkins_home/env/.env.prod infra/.env.prod
                    docker compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} up -d mysql redis
                    docker compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} up -d --no-deps --force-recreate backend-prod
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