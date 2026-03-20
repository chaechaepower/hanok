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

# ★ 1. upstream.conf 파일이 없으면 초기값(prod)으로 자동 생성
if [ ! -f infra/nginx/conf.d/upstream.conf ]; then
    echo "upstream backend { server backend-prod:8080; }" > infra/nginx/conf.d/upstream.conf
fi

# 기본 인프라 컨테이너 실행 (Nginx도 여기서 켜짐)
docker-compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} up -d mysql redis livekit prometheus grafana loki promtail nginx

# ★ 2. upstream.conf 파일 안에서 현재 활성화된 컨테이너 이름 가져오기
ACTIVE_TARGET=$(grep "server backend" infra/nginx/conf.d/upstream.conf | awk '{print $2}' | cut -d':' -f1 || echo "backend-green")

if [ "$ACTIVE_TARGET" = "backend-prod" ] || [ -z "$ACTIVE_TARGET" ]; then
    echo "현재 Blue(prod) 활성 상태 → Green 배포 시작"
    docker-compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} pull backend-green
    docker-compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} up -d --no-deps backend-green
    GREEN_HEALTH="000"
    for i in $(seq 1 30); do
        GREEN_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://172.26.0.24:8081/actuator/health)
        if [ "$GREEN_HEALTH" = "200" ]; then break; fi
        echo "헬스체크 대기 중... ($i/30)"
        sleep 10
    done
    
    if [ "$GREEN_HEALTH" = "200" ]; then
        # ★ 핵심: 복잡한 sed 대신, 살아있는 green 1개만 파일에 덮어쓰기!
        echo "upstream backend { server backend-green:8080; }" > infra/nginx/conf.d/upstream.conf
        
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
        # ★ 핵심: 복잡한 sed 대신, 살아있는 prod 1개만 파일에 덮어쓰기!
        echo "upstream backend { server backend-prod:8080; }" > infra/nginx/conf.d/upstream.conf
        
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

# 프론트엔드 파일 복사
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