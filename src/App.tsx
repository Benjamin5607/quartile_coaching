import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertTriangle, Loader, Zap, CheckCircle, PlusCircle } from 'lucide-react';

// --- 타입 정의 ---
interface Task {
  id: string;
  name: string;
  slaMinutes: number; // Service Level Agreement (SLA) 시간 (분)
  isCompleted: boolean;
}

interface AppState {
  quota: number; // 현재 할당된 쿼터 (예: 사용 가능 크레딧)
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
}

// --- 상수 정의 ---
const INITIAL_QUOTA = 100;
const INITIAL_TASKS: Task[] = [
  { id: 't1', name: '데이터 전처리', slaMinutes: 30, isCompleted: false },
  { id: 't2', name: '모델 학습 실행', slaMinutes: 60, isCompleted: false },
  { id: 't3', name: '결과 검증 및 보고서 생성', slaMinutes: 20, isCompleted: false },
];

// --- SLA 엔진 시뮬레이션 함수 ---
/**
 * 주어진 태스크 목록과 쿼터를 기반으로 SLA 위반 여부를 체크하고, 다음 상태를 계산합니다.
 * @param tasks 현재 태스크 목록
 * @param quota 현재 쿼터
 * @returns { { quota: number, violations: string[] } } 업데이트된 쿼터와 위반 목록
 */
const calculateSLAStatus = (tasks: Task[], quota: number): { quota: number, violations: string[] } => {
  // 방어 로직: 입력값 유효성 검사
  if (!Array.isArray(tasks) || !Number.isFinite(quota)) {
    return { quota: quota, violations: ['Invalid input provided to SLA engine.'] };
  }

  const violations: string[] = [];
  let remainingQuota = quota;

  // 1. 쿼터 소모 시뮬레이션
  const quotaCostPerTask = 10; // 모든 미완료 태스크당 10 쿼터 소모 가정
  const incompleteTasks = tasks.filter(t => !t.isCompleted);
  const totalCost = incompleteTasks.length * quotaCostPerTask;

  // 쿼터가 부족하면 0으로 설정
  remainingQuota = Math.max(0, quota - totalCost);

  // 2. SLA 위반 체크
  tasks.forEach(task => {
    if (!task.isCompleted) {
      // 쿼터 부족 임계값 (예: 20% 미만 또는 특정 비용 미달)
      if (remainingQuota < 20) {
        violations.push(`🚨 ${task.name}: 쿼터 부족으로 인해 SLA 위반 위험! (남은 쿼터: ${remainingQuota} / 필요: ${quotaCostPerTask})`);
      }
    }
  });

  return { quota: remainingQuota, violations: violations };
};

// --- App 컴포넌트 ---
const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    quota: INITIAL_QUOTA,
    tasks: INITIAL_TASKS,
    isLoading: false,
    error: null,
  });

  // 쿼터 및 SLA 상태를 계산하는 핸들러
  const handleSLAUpdate = useCallback(() => {
    setState(prevState => {
      const { quota, tasks } = prevState;
      const { quota: newQuota, violations: newViolations } = calculateSLAStatus(tasks, quota);
      
      // 상태 업데이트
      return {
        ...prevState,
        quota: newQuota,
        error: newViolations.length > 0 ? newViolations.join(' | ') : null,
      };
    });
  }, []);

  // 태스크 완료 처리 핸들러
  const handleTaskUpdate = useCallback((taskId: string, status: 'completed' | 'failed') => {
    setState(prevState => {
      const updatedTasks = prevState.tasks.map(task => {
        if (task.id === taskId) {
          return { ...task, isCompleted: status === 'completed' };
        }
        return task;
      });
      
      // 상태 변경 후 SLA 재계산
      const { quota: newQuota, violations: newViolations } = calculateSLAStatus(updatedTasks, prevState.quota);
      
      return {
        ...prevState,
        tasks: updatedTasks,
        quota: newQuota,
        error: newViolations.length > 0 ? newViolations.join(' | ') : null,
      };
    });
  }, []);

  // 새로운 태스크 생성 핸들러
  const handleTaskCreation = useCallback((name: string, cost: number) => {
    if (state.quota < cost) {
      setState(prevState => ({ ...prevState, error: `쿼터 부족: ${cost} 크레딧이 필요합니다. (현재: ${state.quota})` }));
      return;
    }

    const newTask: Task = {
      id: `t${Date.now()}`,
      name: name,
      slaMinutes: Math.floor(Math.random() * 50) + 10, // 10~60분 사이 랜덤 SLA
      isCompleted: false,
    };

    setState(prevState => {
      const newTasks = [...prevState.tasks, newTask];
      // 쿼터 소모 및 SLA 재계산
      const { quota: newQuota, violations: newViolations } = calculateSLAStatus(newTasks, prevState.quota - cost);
      
      return {
        ...prevState,
        tasks: newTasks,
        quota: newQuota,
        error: newViolations.length > 0 ? newViolations.join(' | ') : null,
      };
    });
  }, [state.quota]);

  // 1. 마운트 시 초기 SLA 상태 계산 및 주기적 업데이트 설정
  useEffect(() => {
    // 초기 로딩 상태 설정
    setState(prevState => ({ ...prevState, isLoading: true, error: null }));
    
    // 초기 SLA 계산
    const initialStatus = calculateSLAStatus(INITIAL_TASKS, INITIAL_QUOTA);
    setState(prevState => ({
      ...prevState,
      quota: initialStatus.quota,
      error: initialStatus.violations.length > 0 ? initialStatus.violations.join(' | ') : null,
      isLoading: false,
    }));

    // 5초마다 SLA 상태 자동 업데이트 시뮬레이션
    const intervalId = setInterval(() => {
      handleSLAUpdate();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [handleSLAUpdate]);

  // 쿼터 바 스타일 계산
  const quotaPercentage = Math.min(100, (state.quota / INITIAL_QUOTA) * 100);
  const isLowQuota = state.quota < 30;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 flex items-center">
            <Zap className="w-8 h-8 text-blue-600 mr-3" />
            SLA 쿼터 관리 시스템
          </h1>
          <p className="text-gray-500 mt-1">프로젝트 자원 할당 및 서비스 레벨 계약(SLA) 위반 위험 모니터링 대시보드</p>
        </header>

        {/* 쿼터 및 상태 요약 패널 */}
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8 border-t-4 border-blue-600">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">📊 시스템 자원 현황</h2>
            <button
              onClick={handleSLAUpdate}
              disabled={state.isLoading}
              className={`flex items-center px-4 py-2 rounded-full font-medium transition duration-150 ${state.isLoading ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
            >
              <Loader className={`w-4 h-4 mr-2 ${state.isLoading ? 'animate-spin' : ''}`} />
              {state.isLoading ? '업데이트 중...' : '수동 상태 점검'}
            </button>
          </div>

          {/* 쿼터 바 */}
          <div className="mb-4">
            <div className="flex justify-between text-sm font-medium text-gray-600 mb-1">
              <span>남은 쿼터: <span className="font-bold text-blue-700">{state.quota.toFixed(0)} / {INITIAL_QUOTA}</span></span>
              <span>사용률: <span className="font-bold">{quotaPercentage.toFixed(0)}%</span></span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${isLowQuota ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${quotaPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* SLA 경고 메시지 */}
          {state.error && (
            <div className={`p-4 rounded-lg ${state.error.includes('위험') ? 'bg-red-100 border-l-4 border-red-500 text-red-800' : 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800'} mb-4`}>
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                <p className="font-medium">⚠️ SLA 경고 발생:</p>
              </div>
              <p className="mt-1 text-sm">{state.error}</p>
            </div>
          )}
        </div>

        {/* 태스크 관리 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 1. 태스크 생성/제어 패널 (좌측) */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-lg sticky top-8 border-t-4 border-green-600">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <PlusCircle className="w-6 h-6 mr-2 text-green-600" />
                태스크 관리 및 생성
              </h2>

              {/* 태스크 생성 버튼 */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">새 태스크 추가</h3>
                <button
                  onClick={() => handleTaskCreation('새로운 분석 태스크', 10)}
                  disabled={state.quota < 10 || state.isLoading}
                  className={`w-full flex justify-center items-center gap-2 px-6 py-3 rounded-lg font-semibold transition duration-150 ${state.quota < 10 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white shadow-md'}`}
                >
                  <PlusCircle className="w-5 h-5" />
                  태스크 생성 (10 쿼터)
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">* 태스크 생성 시 10 쿼터가 소모됩니다.</p>
              </div>

              {/* 쿼터 사용 가이드 */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-md font-semibold text-blue-800 mb-2">💡 쿼터 사용 가이드</h3>
                <p className="text-sm text-blue-700">쿼터는 시스템 자원 크레딧입니다. 태스크를 완료하거나 새로운 태스크를 생성할 때마다 소모됩니다.</p>
                <p className="text-xs text-blue-600 mt-1">SLA 위반은 쿼터 부족과 직결됩니다.</p>
              </div>
            </div>
          </div>

          {/* 2. 할당된 태스크 목록 (우측) */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">📋 할당된 태스크 목록 ({state.tasks.length}개)</h2>
              
              <div className="space-y-6">
                {state.tasks.length === 0 ? (
                  <div className="p-10 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-center">
                    <Zap className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600">아직 할당된 태스크가 없습니다. 좌측에서 새 태스크를 생성해 보세요.</p>
                  </div>
                ) : (
                  state.tasks.map(task => (
                    <div key={task.id} className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition duration-150">
                      <div className="flex justify-between items-start">
                        <div className="flex-grow">
                          <strong className="text-xl text-gray-900 block">{task.name}</strong>
                          <p className="text-sm text-gray-500">SLA 목표: {task.slaMinutes}분</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                            {task.isCompleted ? (
                                <CheckCircle className="w-7 h-7 text-green-500 flex-shrink-0" />
                            ) : (
                                <AlertTriangle className="w-7 h-7 text-orange-500 flex-shrink-0" />
                            )}
                            <span className={`text-xl font-extrabold ${task.isCompleted ? 'text-green-600' : 'text-orange-600'}`}>{task.isCompleted ? '완료' : '진행 중'}</span>
                        </div>
                      </div>
                      
                      <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-base text-gray-600 font-medium">쿼터 소모 예상: 10 크레딧</span>
                        <button
                          onClick={() => handleTaskUpdate(task.id, 'completed')}
                          disabled={task.isCompleted || state.quota < 10}
                          className={`px-6 py-2 rounded-lg font-medium transition duration-150 shadow-md ${task.isCompleted || state.quota < 10 ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                        >
                          {task.isCompleted ? '완료됨' : '✅ 완료 처리'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;