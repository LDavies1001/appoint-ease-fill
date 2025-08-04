import React from 'react';

interface MobileProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
  stepDescription: string;
}

export const MobileProgressBar: React.FC<MobileProgressBarProps> = ({
  currentStep,
  totalSteps,
  stepTitle,
  stepDescription
}) => {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="space-y-3">
      {/* Progress Bar */}
      <div className="relative">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-business to-business-accent transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <span>Step {currentStep + 1}</span>
          <span>{currentStep + 1} of {totalSteps}</span>
        </div>
      </div>

      {/* Step Info */}
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">{stepTitle}</h2>
        <p className="text-sm text-muted-foreground">{stepDescription}</p>
      </div>
    </div>
  );
};