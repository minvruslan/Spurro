export default defineNuxtRouteMiddleware(() => {
  const { isLoggedIn, isAdmin } = useAuthSession()
  if (!isLoggedIn.value) return navigateTo("/login")
  if (isAdmin.value) return navigateTo("/admin")
})
