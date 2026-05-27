import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage'
import PatientProfilePage from './pages/PatientProfilePage';
import WaitingRoomPage from './pages/WaitingRoomPage';
import ExaminationPage from './pages/ExaminationPage';
import ReceptionPage from './pages/ReceptionPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/patientProfile" element={<PatientProfilePage />} />
      <Route path="/waiting-room" element={<WaitingRoomPage />} />
      <Route path="/examination" element={<ExaminationPage />} />
      <Route path="/receptionist" element={<ReceptionPage />} />
    </Routes>
  )
}
export default App;
