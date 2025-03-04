import React from 'react';

export function EmptyState() {
  return (
    <div className="bg-card rounded-lg shadow-sm border border-muted p-8 flex flex-col items-center justify-center text-center h-[450px]">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold mb-3">No Curriculum Generated Yet</h3>
      <p className="text-muted-foreground max-w-md mb-8">
        Select a subject, grade level, and number of weeks, then click "Generate Curriculum" to create a detailed curriculum plan.
      </p>
      <div className="space-y-3 w-full max-w-md">
        <div className="flex items-center text-sm text-muted-foreground bg-muted/40 p-3 rounded-md">
          <svg className="w-5 h-5 mr-3 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Each curriculum includes learning objectives, classroom activities, required materials, and assessment strategies</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground bg-muted/40 p-3 rounded-md">
          <svg className="w-5 h-5 mr-3 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <span>You can also generate exams for each week of your curriculum</span>
        </div>
      </div>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="bg-card rounded-lg shadow-sm border border-muted p-8 flex flex-col items-center justify-center text-center h-[450px]">
      <div className="w-20 h-20 flex items-center justify-center mb-6">
        <svg className="animate-spin w-12 h-12 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <h3 className="text-xl font-semibold mb-3">Generating Curriculum...</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        This may take a moment as we create a detailed curriculum plan tailored to your specifications.
      </p>
      <div className="w-full max-w-md bg-muted/30 h-2 rounded-full overflow-hidden">
        <div className="bg-primary h-full animate-pulse" style={{ width: '60%' }}></div>
      </div>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="bg-destructive/10 rounded-lg p-6 border border-destructive/30">
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-4">
          <div className="w-10 h-10 bg-destructive/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-medium text-destructive mb-2">Error Generating Curriculum</h3>
          <p className="text-destructive/90">{message}</p>
          <div className="mt-4">
            <p className="text-sm text-destructive/80">Please try again or select different options.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 