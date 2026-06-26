import { Routes, Route } from 'react-router-dom'


// thêm page mới
import LoginPage from './pages/auth/LoginPage.jsx'
import LoginRegister from './pages/auth/RegisterPage.jsx'


function App() {
  return (
    <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/register" element={<LoginRegister />} />

    </Routes>
  )
}
export default App;
