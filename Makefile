up:
	docker-compose up -d --build

down:
	docker-compose down

logs:
	docker-compose logs -f

backend:
	docker-compose exec backend sh

frontend:
	docker-compose exec frontend sh

mongo:
	docker-compose exec mongo mongosh -u root -p example

prune:
	docker system prune -af --volumes
