import { Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import Home from "./pages/Home/Home";
import ExamInstructions from "./pages/Exam/ExamInstructions";
import ExamTake from "./pages/Exam/ExamTake";
import ExamResult from "./pages/Exam/ExamResult";
import AdminLayout from "./pages/Admin/AdminLayout";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminExams from "./pages/Admin/AdminExams";
import AdminExamEditor from "./pages/Admin/AdminExamEditor";
import AdminQuestions from "./pages/Admin/AdminQuestions";
import AdminQuestionImport from "./pages/Admin/AdminQuestionImport";
import AdminResults from "./pages/Admin/AdminResults";
import AdminResultDetail from "./pages/Admin/AdminResultDetail";
import AdminStudyBuddy from "./pages/Admin/AdminStudyBuddy";

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/exams/:id/instructions" element={<ExamInstructions />} />
        <Route path="/exams/:id/take" element={<ExamTake />} />
        <Route path="/exams/:id/result" element={<ExamResult />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="exams" element={<AdminExams />} />
          <Route path="exams/new" element={<AdminExamEditor />} />
          <Route path="exams/:id/edit" element={<AdminExamEditor />} />
          <Route path="questions" element={<AdminQuestions />} />
          <Route path="questions/import" element={<AdminQuestionImport />} />
          <Route path="results" element={<AdminResults />} />
          <Route path="results/:id" element={<AdminResultDetail />} />
          <Route path="study-buddy" element={<AdminStudyBuddy />} />
        </Route>

        <Route
          path="*"
          element={
            <div className="mx-auto max-w-md px-4 py-20 text-center">
              <p className="text-4xl">🌸</p>
              <p className="mt-3 font-display text-lg text-stone-600">
                This page wandered off somewhere.
              </p>
              <a href="/" className="mt-4 inline-block text-blossom-500 underline">
                Back to Study Corner
              </a>
            </div>
          }
        />
      </Routes>
    </ErrorBoundary>
  );
}
