import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Overview } from '@/pages/Overview'
import { Dashboard } from '@/pages/Dashboard'
import { CrimeMap } from '@/pages/CrimeMap'
import { HotspotsRisk } from '@/pages/HotspotsRisk'
import { TrendsTime } from '@/pages/TrendsTime'
import { PatrolPlanner } from '@/pages/PatrolPlanner'
import { Cases } from '@/pages/Cases'
import { AIAssistant } from '@/pages/AIAssistant'
import { SafetyScore } from '@/pages/SafetyScore'
import { SystemEthics } from '@/pages/SystemEthics'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { DataProvider } from '@/services/DataContext'
import { DemoProvider } from '@/services/DemoContext'
import { AlertProvider } from '@/services/AlertContext'
import { RoleProvider } from '@/services/RoleContext'

function App() {
  return (
    <ErrorBoundary>
    <DataProvider>
      <RoleProvider>
        <DemoProvider>
          <AlertProvider>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/overview" replace />} />
                <Route path="overview" element={<Overview />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="crime-map" element={<CrimeMap />} />
                <Route path="hotspots-risk" element={<HotspotsRisk />} />
                <Route path="trends-time" element={<TrendsTime />} />
                <Route path="patrol-planner" element={<PatrolPlanner />} />
                <Route path="cases" element={<Cases />} />
                <Route path="ai-assistant" element={<AIAssistant />} />
                <Route path="safety-score" element={<SafetyScore />} />
                <Route path="system-ethics" element={<SystemEthics />} />
                <Route path="*" element={<Navigate to="/overview" replace />} />
              </Route>
            </Routes>
          </AlertProvider>
        </DemoProvider>
      </RoleProvider>
    </DataProvider>
    </ErrorBoundary>
  )
}

export default App
