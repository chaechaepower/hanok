pipeline {
    agent any

    environment {
        IMAGE_NAME = 'kimkangyeon/hanok-backend'
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

                stage('Docker Build & Push') {
                    steps {
                        dir('be') {
                            withCredentials([usernamePassword(
                                    credentialsId: 'dockerhub-credentials',
                                    usernameVariable: 'DOCKER_USER',
                                    passwordVariable: 'DOCKER_PASS'
                            )]) {
                                sh '''
                    docker login -u $DOCKER_USER -p $DOCKER_PASS
                    
                    docker build -t $DOCKER_USER/hanok-backend:prod \
                                 -t $DOCKER_USER/hanok-backend:${BUILD_NUMBER} .
                    
                    docker push $DOCKER_USER/hanok-backend:prod
                    docker push $DOCKER_USER/hanok-backend:${BUILD_NUMBER}
                    
                    docker images $DOCKER_USER/hanok-backend --format "{{.Tag}}" | \
                    grep -v prod | \
                    sort -rn | \
                    tail -n +4 | \
                    xargs -I {} docker rmi $DOCKER_USER/hanok-backend:{} 2>/dev/null || true
                '''
                            }
                        }
                    }
                }

                stage('Deploy') {
                    steps {
                        sh '''
cp /var/jenkins_home/env/.env.prod infra/.env.prod

LIVEKIT_SECRET=$(grep LIVEKIT_API_SECRET infra/.env.prod | cut -d '=' -f2)
cat > infra/livekit.yaml << LKEOF
port: 7880
keys:
  devkey: ${LIVEKIT_SECRET}
webhook:
  urls:
    - http://13.124.238.68/api/v1/streams/webhook
  api_key: devkey
LKEOF

docker-compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} up -d mysql redis
docker-compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} up -d livekit
docker-compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} up -d prometheus grafana
docker-compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} up -d loki promtail

# 현재 active 컨테이너 확인
ACTIVE=$(grep "server localhost:808" /etc/nginx/sites-enabled/default | grep -v "^[[:space:]]*#" | grep -o "808[01]" | head -1)

if [ "$ACTIVE" = "8080" ] || [ -z "$ACTIVE" ]; then
    # blue가 active → green에 배포
    docker-compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} up -d --no-deps --force-recreate backend-green
    sleep 30
    GREEN_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://172.26.0.24:8081/actuator/health)
    if [ "$GREEN_HEALTH" = "200" ]; then
        sudo sed -i "s|server localhost:8080;  # blue (현재 active)|# server localhost:8080;  # blue (대기)|" /etc/nginx/sites-enabled/default
        sudo sed -i "s|# server localhost:8081;  # green (대기)|server localhost:8081;  # green (현재 active)|" /etc/nginx/sites-enabled/default
        sudo /usr/local/bin/nginx-reload.sh
        sleep 3
        docker-compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} stop backend-prod
        echo "배포 완료 - green 활성화"
    else
        echo "green 헬스체크 실패 - blue 유지"
        docker-compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} stop backend-green
        exit 1
    fi
else
    # green이 active → blue에 배포
    docker-compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} up -d --no-deps --force-recreate backend-prod
    sleep 30
    BLUE_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://172.26.0.24:8080/actuator/health)
    if [ "$BLUE_HEALTH" = "200" ]; then
        sudo sed -i "s|# server localhost:8080;  # blue (대기)|server localhost:8080;  # blue (현재 active)|" /etc/nginx/sites-enabled/default
        sudo sed -i "s|server localhost:8081;  # green (현재 active)|# server localhost:8081;  # green (대기)|" /etc/nginx/sites-enabled/default
        sudo /usr/local/bin/nginx-reload.sh
        sleep 3
        docker-compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} stop backend-green
        echo "배포 완료 - blue 활성화"
    else
        echo "blue 헬스체크 실패 - green 유지"
        docker-compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} stop backend-prod
        exit 1
    fi
fi

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