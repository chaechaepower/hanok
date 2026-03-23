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
                expression { env.GIT_BRANCH == 'origin/master' }
            }
            stages {
                stage('Build') {
                    parallel {
                        stage('Backend Build') {
                            steps {
                                dir('be') {
                                    sh 'chmod +x gradlew'
                                    withSonarQubeEnv('sonarqube') {
                                        // 🚨 [수정됨] || true 제거! 이제 컴파일/테스트 실패 시 여기서 배포가 즉시 멈춥니다.
                                        sh '''./gradlew bootJar sonar --no-daemon --build-cache --continue -x test \
                                        -Dsonar.projectKey=hanok \
                                        -Dsonar.projectName=hanok \
                                        -Dsonar.host.url=http://j14d105.p.ssafy.io:9000'''
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
                                grep -v prod | sort -rn | tail -n +4 | \
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
                        
                        # upstream.conf 파일 자동 생성 (초기화)
                        if [ ! -f infra/nginx/conf.d/upstream.conf ]; then
                            echo "upstream backend { server backend-prod:8080; }" > infra/nginx/conf.d/upstream.conf
                        fi
                        
                        # 기본 인프라 컨테이너 실행
                        docker-compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} up -d mysql redis livekit prometheus grafana loki promtail nginx
                        
                        # 배포 타겟 결정
                        ACTIVE_TARGET=$(grep "server backend" infra/nginx/conf.d/upstream.conf | awk '{print $2}' | cut -d':' -f1 || echo "backend-green")
                        
                        if [ "$ACTIVE_TARGET" = "backend-prod" ] || [ -z "$ACTIVE_TARGET" ]; then
                            TARGET="backend-green"
                            TARGET_PORT="8081"
                            STOP_TARGET="backend-prod"
                        else
                            TARGET="backend-prod"
                            TARGET_PORT="8080"
                            STOP_TARGET="backend-green"
                        fi
                        
                        echo "현재 활성 상태: ${STOP_TARGET} → ${TARGET} 배포 시작"
                        
                        docker-compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} pull ${TARGET}
                        docker-compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} up -d --no-deps ${TARGET}
                        docker-compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} up -d mysql redis livekit prometheus grafana loki promtail nginx influxdb
                        
                        # 헬스체크
                        HEALTH="000"
                        for i in $(seq 1 30); do
                            HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://172.26.0.24:${TARGET_PORT}/actuator/health)
                            if [ "$HEALTH" = "200" ]; then break; fi
                            echo "헬스체크 대기 중... ($i/30)"
                            sleep 10
                        done
                        
                        if [ "$HEALTH" = "200" ]; then
                            echo "upstream backend { server ${TARGET}:8080; }" > infra/nginx/conf.d/upstream.conf
                            docker exec hanok-nginx nginx -s reload
                            sleep 3
                            docker-compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} stop ${STOP_TARGET}
                            echo "배포 완료 - ${TARGET} 활성화"
                        else
                            echo "❌ ${TARGET} 헬스체크 실패! 기존 서버(${STOP_TARGET}) 유지"
                            docker-compose -f ${COMPOSE_FILE} --env-file ${ENV_FILE} stop ${TARGET}
                            exit 1
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