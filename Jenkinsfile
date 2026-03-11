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
            parallel {
                stage('Backend Build') {
                    steps {
                        dir('be') {
                            sh 'chmod +x gradlew'
                            sh './gradlew bootJar -x test --no-daemon'
                        }
                    }
                }
                stage('Frontend Build') {
                    steps {
                        dir('fe') {
                            sh 'cp /var/jenkins_home/env/.env.fe .env'
                            sh 'npm install'
                            sh 'npm run build'
                        }
                    }
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
                expression {
                    env.GIT_BRANCH == 'origin/master'
                }
            }
            steps {
                dir('be') {
                    sh "docker build -t ${IMAGE_NAME}:prod ."
                }
            }
        }

        stage('Deploy') {
            when {
                expression {
                    env.GIT_BRANCH == 'origin/master'
                }
            }
            steps {
                sh '''
                    cp /var/jenkins_home/env/.env.prod infra/.env.prod

                    # livekit.yaml 동적 생성
                    LIVEKIT_SECRET=$(grep LIVEKIT_API_SECRET infra/.env.prod | cut -d '=' -f2)
                    cat > infra/livekit.yaml << EOF
port: 7880
keys:
  devkey: $LIVEKIT_SECRET
webhook:
  urls:
    - http://13.124.238.68/api/v1/streams/webhook
  api_key: devkey
EOF

                    docker compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} up -d mysql redis
                    docker compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} up -d --no-deps --force-recreate livekit
                    docker compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} up -d --no-deps --force-recreate backend-prod

                    # 프론트 배포
                    rm -rf /var/www/hanok/*
                    cp -r fe/dist/* /var/www/hanok/
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