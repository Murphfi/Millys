# Milty

Esta primera versión, es un gestor de gastos mensuales en pareja que reemplaza un Excel compartido en Drive.
Proyecto personal para practicar Spring Boot y tecnologías modernas.

## Stack

- **Backend:** Java 21 + Spring Boot 3.x + Spring Security + JWT + Spring Data JPA
- **Frontend:** Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui + Recharts
- **Base de datos:** Neon (PostgreSQL serverless)
- **Deploy frontend:** Vercel
- **Deploy backend:** Render free tier

## Estructura

```
Milty/
├── backend/    ← Spring Boot
└── frontend/   ← Next.js 15
```

## Comandos

```bash
# Backend
cd backend && ./mvnw spring-boot:run

# Frontend
cd frontend && npm run dev
```

## Scope V1

1. Login para 3 usuarios: Murphfas, Lilly, Test
2. Gestión de gastos mensuales
3. Visualización con gráficas

## Reglas

- Sin Docker en local
- Este proyecto es para aprendizaje: explicar antes de hacer
- No añadir features fuera del scope de V1
- Rama `develop` para trabajo diario, `main` para releases
