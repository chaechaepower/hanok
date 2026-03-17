pipeline {
    agent any

    environment {
        IMAGE_NAME = 'hanok-backend'
        CONTAINER_NAME = 'hanok-backend-prod'
        COMPOSE_FILE = 'infra/docker-compose.yaml'
        ENV_FILE = 'infra/.env.prod'
    }

    stages {
        stage('Check Branch') {
            when {
                expression {
                    env.GIT_BRANCH == 'origin/master'
                }
            }
            stages {
                stage('Build') {
                    parallel {
                        stage('Backend Build') {
                            steps {
                                dir('be') {
                                    sh 'chmod +x gradlew'
                                    withSonarQubeEnv('sonarqube') {
                                        sh '''./gradlew test jacocoTestReport bootJar sonar --no-daemon --build-cache --continue \
                    -Dsonar.projectKey=hanok \
                    -Dsonar.projectName=hanok \
                    -Dsonar.host.url=http://j14d105.p.ssafy.io:9000 || true'''
                                    }
                                }
                            }
                        }

                        stage('Frontend Build') {
                            steps {
                                dir('fe') {
                                    sh 'cp /var/jenkins_home/env/.env.fe .env'
                                    sh 'npm install --legacy-peer-deps'
                                    sh 'npm run build'
                                }
                            }
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

    docker-compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} up -d mysql redis
    docker-compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} up -d --no-deps --force-recreate backend-prod
    docker-compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} up -d prometheus grafana

    rm -rf /var/www/hanok/*
    cp -r fe/dist/* /var/www/hanok/
'''
                    }
                }
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