import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, X, ThumbsUp, ThumbsDown, Send } from 'lucide-react';
import { toast } from 'sonner';

interface FeedbackBoxProps {
  deploymentId: string;
  onClose?: () => void;
}

export function FeedbackBox({ deploymentId, onClose }: FeedbackBoxProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [rating, setRating] = useState<'positive' | 'negative' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating && !feedback.trim()) {
      toast.error('Please provide a rating or feedback');
      return;
    }

    setIsSubmitting(true);

    try {
      // Save feedback to localStorage
      const feedbackData = {
        deploymentId,
        rating,
        feedback: feedback.trim(),
        timestamp: new Date().toISOString()
      };

      const existingFeedback = JSON.parse(localStorage.getItem('deployify-feedback') || '[]');
      existingFeedback.push(feedbackData);
      localStorage.setItem('deployify-feedback', JSON.stringify(existingFeedback));

      toast.success('Thank you for your feedback!');
      
      // Reset form
      setRating(null);
      setFeedback('');
      setIsExpanded(false);
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isExpanded) {
    return (
      <Card className="glass-card rounded-xl p-4 border-indigo-500/20">
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full flex items-center justify-between text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg group-hover:from-indigo-500/30 group-hover:to-purple-500/30 transition-all">
              <MessageSquare className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <h4 className="font-medium text-white">Share your feedback</h4>
              <p className="text-sm text-gray-400">Help us improve your deployment experience</p>
            </div>
          </div>
          <div className="text-indigo-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
            Click to expand →
          </div>
        </button>
      </Card>
    );
  }

  return (
    <Card className="glass-card rounded-xl p-6 border-indigo-500/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg">
            <MessageSquare className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h4 className="font-semibold text-white">Share your feedback</h4>
            <p className="text-sm text-gray-400">Help us improve your deployment experience</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsExpanded(false);
            if (onClose) onClose();
          }}
          className="text-gray-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Rating Section */}
      <div className="mb-4">
        <label className="text-sm text-gray-400 mb-2 block">How was your deployment experience?</label>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setRating('positive')}
            className={`flex-1 gap-2 ${
              rating === 'positive'
                ? 'bg-green-500/20 border-green-500/50 text-green-400'
                : 'glass-card border-white/20 text-gray-400 hover:border-green-500/30 hover:text-green-400'
            }`}
          >
            <ThumbsUp className="h-4 w-4" />
            Great
          </Button>
          <Button
            variant="outline"
            onClick={() => setRating('negative')}
            className={`flex-1 gap-2 ${
              rating === 'negative'
                ? 'bg-red-500/20 border-red-500/50 text-red-400'
                : 'glass-card border-white/20 text-gray-400 hover:border-red-500/30 hover:text-red-400'
            }`}
          >
            <ThumbsDown className="h-4 w-4" />
            Needs Work
          </Button>
        </div>
      </div>

      {/* Feedback Text */}
      <div className="mb-4">
        <label className="text-sm text-gray-400 mb-2 block">
          Additional comments (optional)
        </label>
        <Textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Share your thoughts, suggestions, or report any issues..."
          className="glass-card border-white/20 text-white placeholder:text-gray-500 min-h-[100px] resize-none"
        />
      </div>

      {/* Submit Button */}
      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white gap-2"
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setRating(null);
            setFeedback('');
            setIsExpanded(false);
            if (onClose) onClose();
          }}
          className="glass-card border-white/20 text-gray-400 hover:text-white"
        >
          Cancel
        </Button>
      </div>

      {/* Privacy Notice */}
      <p className="text-xs text-gray-500 mt-3 text-center">
        Your feedback helps us improve. Deployment ID: {deploymentId.slice(0, 8)}
      </p>
    </Card>
  );
}
