"use client";

import { useState } from 'react';
import { Star, ThumbsUp, Trash2, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Textarea } from '@/shared/ui/textarea';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { useToast } from '@/shared/hooks/use-toast';
import {
  useModuleReviews,
  useCreateReview,
  useDeleteReview,
  useVoteReview,
} from '@/shared/data/queries/module-reviews';
import { useAvailableSemesters } from '@/shared/data/queries/catalogue';
import { useAuthStore } from '@/features/auth';

interface ModuleReviewsProps {
  moduleCode: string;
}

export function ModuleReviews({ moduleCode }: ModuleReviewsProps) {
  const { data: reviewsData, isLoading } = useModuleReviews(moduleCode);
  const { data: semestersData } = useAvailableSemesters();
  const createReview = useCreateReview(moduleCode);
  const deleteReview = useDeleteReview(moduleCode);
  const voteReview = useVoteReview(moduleCode);
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [term, setTerm] = useState('');
  const [assessmentWeightage, setAssessmentWeightage] = useState({
    midterm: 0,
    finals: 0,
    assignments: 0,
    project: 0,
    labs: 0,
  });

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast({
        title: 'Error',
        description: 'Please select a rating',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Filter out zero weightage
      const filteredWeightage = Object.fromEntries(
        Object.entries(assessmentWeightage).filter(([, value]) => value > 0)
      );

      await createReview.mutateAsync({
        rating,
        content,
        term: term || undefined,
        assessmentWeightage: Object.keys(filteredWeightage).length > 0 ? filteredWeightage : undefined,
      });

      toast({
        title: 'Success',
        description: 'Review submitted successfully',
      });

      // Reset form
      setShowReviewForm(false);
      setRating(0);
      setContent('');
      setTerm('');
      setAssessmentWeightage({
        midterm: 0,
        finals: 0,
        assignments: 0,
        project: 0,
        labs: 0,
      });
    } catch (error: unknown) {
      const responseError =
        error && typeof error === 'object'
          ? (error as { response?: { data?: { error?: string; message?: string } } }).response?.data
          : undefined;
      toast({
        title: 'Error',
        description: responseError?.error || responseError?.message || 'Failed to submit review',
        variant: 'destructive',
      });
    }
  };

  const handleVote = async (reviewId: string) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to vote on reviews',
        variant: 'destructive',
      });
      return;
    }

    try {
      await voteReview.mutateAsync(reviewId);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to vote on review',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      await deleteReview.mutateAsync(reviewId);
      toast({
        title: 'Success',
        description: 'Review deleted successfully',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete review',
        variant: 'destructive',
      });
    }
  };

  const renderStars = (count: number, interactive: boolean = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= count
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={() => interactive && onRate?.(star)}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground">Loading reviews...</p>
        </CardContent>
      </Card>
    );
  }

  const reviews = reviewsData?.reviews || [];
  const userHasReviewed = reviews.some((r) => r.userId === user?.id);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Student Reviews & Ratings</CardTitle>
            <CardDescription>
              {reviewsData?.totalReviews || 0} reviews • Average: {reviewsData?.averageRating?.toFixed(1) || 'N/A'}
            </CardDescription>
          </div>
          {user && !userHasReviewed && (
            <Button onClick={() => setShowReviewForm(!showReviewForm)}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Write a Review
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Review Form */}
        {showReviewForm && (
          <div className="border rounded-lg p-6 space-y-4 bg-muted/30">
            <h3 className="font-semibold text-lg">Write Your Review</h3>
            
            <div>
              <Label>Rating *</Label>
              {renderStars(rating, true, setRating)}
            </div>

            <div>
              <Label>Academic Term (Optional)</Label>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a semester" />
                </SelectTrigger>
                <SelectContent>
                  {semestersData?.map((semester) => (
                    <SelectItem key={semester} value={semester}>
                      {semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Review (Optional)</Label>
              <Textarea
                placeholder="Share your experience with this module..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
              />
            </div>

            <div>
              <Label>Assessment Weightage (%) (Optional)</Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2">
                {Object.entries(assessmentWeightage).map(([key, value]) => (
                  <div key={key}>
                    <Label className="text-xs capitalize">{key}</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={value}
                      onChange={(e) =>
                        setAssessmentWeightage({
                          ...assessmentWeightage,
                          [key]: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmitReview} disabled={createReview.isPending}>
                {createReview.isPending ? 'Submitting...' : 'Submit Review'}
              </Button>
              <Button variant="outline" onClick={() => setShowReviewForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground font-medium">No Reviews Yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Be the first to review this module!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-semibold text-primary">
                        {review.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold">{review.user.name}</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {renderStars(review.rating)}
                        {review.term && <span>• {review.term}</span>}
                      </div>
                    </div>
                  </div>
                  {user?.id === review.userId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(review.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {review.content && (
                  <p className="text-sm">{review.content}</p>
                )}

                {review.assessmentWeightage && Object.keys(review.assessmentWeightage).length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Assessment Breakdown:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(review.assessmentWeightage as Record<string, number>).map(
                        ([key, value]) => (
                          <Badge key={key} variant="secondary">
                            <span className="capitalize">{key}</span>: {value}%
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVote(review.id)}
                    className="gap-2"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Helpful ({review.helpfulCount})
                  </Button>
                  <span className="text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
