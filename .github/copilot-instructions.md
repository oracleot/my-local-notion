# Copilot Instructions

## Code Organization & Component Size

### Component Size Limit
**CRITICAL RULE**: Never create or allow any component, file, or module to exceed **200 lines of code**.

When a component approaches or exceeds this limit:
- **Immediately refactor** using composition patterns
- Break into smaller, focused components
- Extract logic into custom hooks or utility functions
- Separate concerns into distinct modules

### Composition Over Monolithic Components

Always prefer **composition patterns** to keep components small and maintainable:

1. **Component Composition**
   - Break large components into smaller, focused sub-components
   - Use children props and component composition
   - Create wrapper components that compose smaller parts
   
   ```tsx
   // ❌ Bad: 300-line monolithic component
   function Dashboard() {
     // All logic and UI in one file
   }
   
   // ✅ Good: Composed from smaller components
   function Dashboard() {
     return (
       <DashboardLayout>
         <DashboardHeader />
         <DashboardStats />
         <DashboardContent />
         <DashboardFooter />
       </DashboardLayout>
     );
   }
   ```

2. **Extract Custom Hooks**
   - Move complex logic into custom hooks
   - Keep component files focused on rendering
   - Each hook should have a single responsibility
   
   ```tsx
   // ✅ Extract business logic
   function useUserDashboard() {
     // Logic here
     return { data, actions };
   }
   
   function Dashboard() {
     const { data, actions } = useUserDashboard();
     return <div>...</div>;
   }
   ```

3. **Utility Modules**
   - Extract pure functions into separate utility files
   - Group related utilities into modules
   - Keep components focused on UI concerns

4. **Container/Presentational Pattern**
   - Separate data fetching (containers) from UI (presentational)
   - Keep presentational components small and reusable
   - Move side effects to container components

### Enforcement Strategy

When reviewing or generating code:
1. **Always check line count** before completing a component
2. **Proactively suggest refactoring** if approaching 150 lines
3. **Refuse to create** components over 200 lines
4. **Automatically split** by:
   - Identifying logical sections
   - Creating meaningful sub-components
   - Extracting reusable parts
   - Moving logic to hooks/utils

### Benefits of This Approach

- **Maintainability**: Smaller files are easier to understand and modify
- **Testability**: Focused components are easier to test
- **Reusability**: Composition enables component reuse
- **Performance**: Smaller components can be optimized individually
- **Collaboration**: Reduces merge conflicts and improves code review

---

**Remember**: If you find yourself writing a component over 200 lines, STOP. Refactor using composition.

---

## Code Quality & Best Practices

- Always run linting and ensure builds passes
- Use your vercel best practices skill
- When designing components, leverage your front-end design skills to create intuitive and visually appealing interfaces
- When testing UI, use playwright mcp to test visually and ensure the user experience is smooth and bug-free
