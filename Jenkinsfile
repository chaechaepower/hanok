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
set +e
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

# 기본 인프라 컨테이너 실행 (여기에 Nginx도 포함되어 있다고 가정)
docker-compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} up -d mysql redis livekit prometheus grafana loki promtail nginx

# Nginx 컨테이너 내부의 설정 파일에서 현재 활성화된(down이 없는) 타겟 찾기
ACTIVE_TARGET=$(docker exec hanok-nginx grep "server hanok-backend" /etc/nginx/conf.d/default.conf | grep -v "down" | awk '{print $2}' | cut -d':' -f1)

if [ "$ACTIVE_TARGET" = "hanok-backend-prod" ] || [ -z "$ACTIVE_TARGET" ]; then
    echo "현재 Blue(prod) 활성 상태 → Green 배포 시작"
    docker-compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} pull backend-green
    docker-compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} up -d --no-deps backend-green
    GREEN_HEALTH="000"
    for i in $(seq 1 30); do
        # 백엔드 컨테이너 포트가 호스트에 8081로 뚫려있다고 가정한 헬스체크
        GREEN_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://172.26.0.24:8081/actuator/health)
        if [ "$GREEN_HEALTH" = "200" ]; then break; fi
        echo "헬스체크 대기 중... ($i/30)"
        sleep 10
    done
    
    if [ "$GREEN_HEALTH" = "200" ]; then
        # Nginx 컨테이너 안에서 직접 sed로 설정 파일 수정
        docker exec hanok-nginx sed -i "s|server hanok-backend-green:8080 down;|server hanok-backend-green:8080;|" /etc/nginx/conf.d/default.conf
        docker exec hanok-nginx sed -i "s|server hanok-backend-prod:8080;|server hanok-backend-prod:8080 down;|" /etc/nginx/conf.d/default.conf
        
        # Nginx 리로드 (핵심!)
        docker exec hanok-nginx nginx -s reload
        sleep 3
        docker-compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} stop backend-prod
        echo "배포 완료 - green 활성화"
    else
        echo "green 헬스체크 실패 - blue 유지"
        docker-compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} stop backend-green
        exit 1
    fi
else
    echo "현재 Green 활성 상태 → Blue(prod) 배포 시작"
    docker-compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} pull backend-prod
    docker-compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} up -d --no-deps backend-prod
    BLUE_HEALTH="000"
    for i in $(seq 1 30); do
        BLUE_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://172.26.0.24:8080/actuator/health)
        if [ "$BLUE_HEALTH" = "200" ]; then break; fi
        echo "헬스체크 대기 중... ($i/30)"
        sleep 10
    done
    
    if [ "$BLUE_HEALTH" = "200" ]; then
        # Nginx 컨테이너 안에서 직접 sed로 설정 파일 수정
        docker exec hanok-nginx sed -i "s|server hanok-backend-prod:8080 down;|server hanok-backend-prod:8080;|" /etc/nginx/conf.d/default.conf
        docker exec hanok-nginx sed -i "s|server hanok-backend-green:8080;|server hanok-backend-green:8080 down;|" /etc/nginx/conf.d/default.conf
        
        # Nginx 리로드 (핵심!)
        docker exec hanok-nginx nginx -s reload
        sleep 3
        docker-compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} stop backend-green
        echo "배포 완료 - blue 활성화"
    else
        echo "blue 헬스체크 실패 - green 유지"
        docker-compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} stop backend-prod
        exit 1
    fi
fi

# 프론트엔드 파일 복사 (볼륨으로 연결되어 있으므로 즉시 반영됨)
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