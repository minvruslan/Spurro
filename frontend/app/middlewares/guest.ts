export default defineNuxtRouteMiddleware(() => {
  const { isLoggedIn, isAdmin } = useAuthSession()
  if (isLoggedIn.value) return navigateTo(isAdmin.value ? "/admin" : "/app")
})
