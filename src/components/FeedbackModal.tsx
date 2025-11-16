import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Send, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  deploymentData: {
    deploymentId: string;
    provider: string;
    siteUrl?: string;
    gitUrl: string;
  };
}

export function FeedbackModal({ isOpen, onClose, deploymentData }: FeedbackModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [category, setCategory] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { id: 'speed', label: 'Deployment Speed', icon: '⚡' },
    { id: 'ease', label: 'Ease of Use', icon: '🎯' },
    { id: 'reliability', label: 'Reliability', icon: '🛡️' },
    { id: 'features', label: 'Features', icon: '✨' },
    { id: 'documentation', label: 'Documentation', icon: '📚' },
    { id: 'other', label: 'Other', icon: '💭' },
  ];

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please provide a rating');
      return;
    }

    if (!feedback.trim()) {
      toast.error('Please provide some feedback');
      return;
    }

    setIsSubmitting(true);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
      
      const feedbackData = {
        deploymentId: deploymentData.deploymentId,
        provider: deploymentData.provider,
        rating,
        feedback: feedback.trim(),
        category,
        siteUrl: deploymentData.siteUrl,
        gitUrl: deploymentData.gitUrl,
      };

      const response = await fetch(`${backendUrl}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit feedback');
      }
      
      console.log('Feedback submitted successfully:', result);
      
      toast.success('Thank you for your feedback!', {
        description: 'Your feedback helps us improve Deployify.',
      });

      // Reset form and close
      setRating(0);
      setFeedback('');
      setCategory('');
      onClose();

    } catch (error) {
      toast.error('Failed to submit feedback', {
        description: 'Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] w-[95vw] glass-card border-white/20 overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4 border-b border-white/10">
          <DialogTitle className="text-xl font-display font-bold text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-purple-400" />
            Share Your Feedback
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          <div className="space-y-6 py-4">
          {/* Deployment Info */}
          <Card className="p-4 bg-white/5 border-white/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/70">Deployment</span>
              <Badge variant="secondary" className="text-xs">
                {deploymentData.deploymentId.slice(0, 8)}
              </Badge>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-white/60">Provider:</span>
                <Badge className="capitalize">{deploymentData.provider}</Badge>
              </div>
              {deploymentData.siteUrl && (
                <div className="flex items-center gap-2">
                  <span className="text-white/60">Site:</span>
                  <a 
                    href={deploymentData.siteUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-300 hover:text-blue-200 truncate max-w-xs"
                  >
                    {deploymentData.siteUrl}
                  </a>
                </div>
              )}
            </div>
          </Card>

          {/* Rating */}
          <div className="space-y-3">
            <Label className="text-white font-medium">
              How would you rate your deployment experience?
            </Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`p-1 rounded transition-colors ${
                    star <= rating 
                      ? 'text-yellow-400 hover:text-yellow-300' 
                      : 'text-white/30 hover:text-white/50'
                  }`}
                >
                  <Star className="h-8 w-8 fill-current" />
                </button>
              ))}
              {rating > 0 && (
                <div className="ml-3 flex items-center gap-2">
                  {rating >= 4 ? (
                    <ThumbsUp className="h-5 w-5 text-green-400" />
                  ) : (
                    <ThumbsDown className="h-5 w-5 text-orange-400" />
                  )}
                  <span className="text-white/70">
                    {rating === 5 ? 'Excellent!' : 
                     rating === 4 ? 'Good' : 
                     rating === 3 ? 'Average' : 
                     rating === 2 ? 'Poor' : 'Very Poor'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-3">
            <Label className="text-white font-medium">
              What aspect would you like to comment on?
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    category === cat.id
                      ? 'border-purple-400/50 bg-purple-500/20 text-white'
                      : 'border-white/20 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-sm font-medium">{cat.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Text */}
          <div className="space-y-3">
            <Label htmlFor="feedback" className="text-white font-medium">
              Tell us more about your experience
            </Label>
            <Textarea
              id="feedback"
              placeholder="What went well? What could be improved? Any suggestions for new features?"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[120px] bg-white/10 border-white/20 text-white placeholder:text-white/50 resize-none"
              maxLength={1000}
            />
            <div className="text-xs text-white/50 text-right">
              {feedback.length}/1000 characters
            </div>
          </div>

          {/* Quick Suggestions */}
          {rating > 0 && rating < 4 && (
            <Card className="p-4 bg-orange-500/10 border-orange-400/30">
              <h4 className="text-sm font-semibold text-orange-300 mb-2">
                💡 Quick feedback options:
              </h4>
              <div className="flex flex-wrap gap-2">
                {[
                  'Deployment was too slow',
                  'Process was confusing',
                  'Missing features',
                  'Error messages unclear',
                  'Documentation needs improvement',
                  'UI could be better'
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setFeedback(prev => 
                      prev ? `${prev}\n• ${suggestion}` : `• ${suggestion}`
                    )}
                    className="text-xs px-3 py-1 rounded-full bg-orange-500/20 text-orange-200 hover:bg-orange-500/30 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </Card>
          )}
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex-shrink-0 pt-4 border-t border-white/10 mt-4">
          <div className="flex gap-3">
            <Button
              onClick={handleClose}
              variant="outline"
              disabled={isSubmitting}
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              Skip
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0 || !feedback.trim()}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Feedback
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}