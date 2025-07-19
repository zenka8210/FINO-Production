'use client';

import { useState } from 'react';
import WriteReviewForm from '@/app/components/WriteReviewForm';

export default function DebugReviewPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReview = async (reviewData: { rating: number; comment: string }): Promise<void> => {
    console.log('🔍 DEBUG: handleSubmitReview called with:', reviewData);
    
    setIsSubmitting(true);
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('✅ DEBUG: Review submission completed');
    setIsSubmitting(false);
  };

  const handleLoginRedirect = () => {
    console.log('🔍 DEBUG: Login redirect called');
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Debug Review Form</h1>
      <p className="mb-4 text-gray-600">
        This page is for debugging the WriteReviewForm component. 
        Check the browser console for debug messages when you submit a review.
      </p>
      
      {/* Simple Event Test */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Simple Event Test</h2>
        <button 
          onClick={() => console.log('🔍 Simple button clicked!')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test Simple Click
        </button>
        <p className="text-sm text-gray-600 mt-2">This button should log to console when clicked</p>
      </div>
      
      <div className="max-w-lg border p-4 rounded-lg">
        <WriteReviewForm
          onSubmit={handleSubmitReview}
          isSubmitting={isSubmitting}
          isLoggedIn={true}
          onLoginRedirect={handleLoginRedirect}
        />
      </div>
    </div>
  );
}
