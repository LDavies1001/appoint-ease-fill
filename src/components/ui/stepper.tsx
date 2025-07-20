import React from 'react';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepperProps {
  currentStep: number;
  steps: {
    title: string;
    description?: string;
  }[];
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({ currentStep, steps, className }) => {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <div key={index} className="flex items-center">
              <div className="flex flex-col items-center">
                {/* Step Circle */}
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                    {
                      "bg-accent border-accent text-white": isCompleted,
                      "bg-accent border-accent text-white shadow-lg scale-110": isCurrent,
                      "bg-background border-muted-foreground/30 text-muted-foreground": isUpcoming,
                    }
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{stepNumber}</span>
                  )}
                </div>

                {/* Step Title */}
                <div className="mt-2 text-center max-w-[120px]">
                  <p
                    className={cn(
                      "text-sm font-medium transition-colors duration-300",
                      {
                        "text-accent": isCompleted || isCurrent,
                        "text-muted-foreground": isUpcoming,
                      }
                    )}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4 mb-6">
                  <div
                    className={cn(
                      "h-0.5 w-full transition-colors duration-300",
                      {
                        "bg-accent": stepNumber < currentStep,
                        "bg-muted-foreground/30": stepNumber >= currentStep,
                      }
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};