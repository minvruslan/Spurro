export const useNavigationLock = () => {
  const locked = useState("navigation-lock", () => false)
  return { locked }
}
