---
root: true
targets: ["*"]
description: "System Modeler - A systems thinking visualization tool with DSL support"
globs: ["**/*"]
---

# System Modeler Project

This is a React TypeScript application for systems thinking and modeling. It provides a visual interface for creating and analyzing system dynamics diagrams with support for stocks, flows, and feedback loops.

## Project Structure

- `src/components/` - React components including DSLEditor, SystemDiagram, FlowNode, StockNode
- `src/models/` - System modeling data structures
- `src/parser/` - DSL parser for system definitions
- `src/utils/` - Utility functions including layout engines

## Technology Stack

- React with TypeScript
- Vite for build tooling
- React Flow for diagram rendering
- ELK (Eclipse Layout Kernel) for automatic graph layout

## Development Guidelines

- Use TypeScript for all code
- Follow React best practices and hooks patterns
- Keep components focused and reusable
- Use proper TypeScript types, avoid `any`
- Write self-documenting code with clear variable and function names

## Code Style

- Use 2 spaces for indentation
- Use semicolons
- Prefer functional components with hooks
- Use meaningful component and variable names
- Keep components in separate files

## Architecture Principles

- Separate UI components from business logic
- Keep parser logic isolated in dedicated modules
- Use proper state management for diagram data
- Implement clear interfaces between components
- Follow single responsibility principle
