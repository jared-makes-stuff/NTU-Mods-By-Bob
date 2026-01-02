"use client";

import { useState } from 'react';
import { Plus, ChevronUp, Trash2, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { Textarea } from '@/shared/ui/textarea';
import { useToast } from '@/shared/hooks/use-toast';
import {
  useModuleTopics,
  useCreateTopic,
  useDeleteTopic,
  useVoteTopic,
  type ModuleTopic,
} from '@/shared/data/queries/module-topics';
import { useAuthStore } from '@/features/auth';

interface ModuleTopicsProps {
  moduleCode: string;
}

export function ModuleTopics({ moduleCode }: ModuleTopicsProps) {
  const { data: topicsData, isLoading } = useModuleTopics(moduleCode);
  const createTopic = useCreateTopic(moduleCode);
  const deleteTopic = useDeleteTopic(moduleCode);
  const voteTopic = useVoteTopic(moduleCode);
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicDuration, setNewTopicDuration] = useState('');
  const [newTopicWeek, setNewTopicWeek] = useState('');
  const [newSuggestedEdit, setNewSuggestedEdit] = useState('');
  const [newEditReason, setNewEditReason] = useState('');
  const [selectedParent, setSelectedParent] = useState<string | null>(null);

  const handleAddTopic = async () => {
    if (!newTopicName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a topic name',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createTopic.mutateAsync({
        name: newTopicName.trim(),
        duration: newTopicDuration.trim() || undefined,
        weekTaught: newTopicWeek ? parseInt(newTopicWeek) : undefined,
        suggestedEdit: newSuggestedEdit.trim() || undefined,
        editReason: newEditReason.trim() || undefined,
        parentId: selectedParent || undefined,
        level: selectedParent ? 2 : 1,
      });

      toast({
        title: 'Success',
        description: 'Topic added successfully',
      });

      setNewTopicName('');
      setNewTopicDuration('');
      setNewTopicWeek('');
      setNewSuggestedEdit('');
      setNewEditReason('');
      setSelectedParent(null);
      setShowAddForm(false);
    } catch (error: unknown) {
      const responseError =
        error && typeof error === 'object'
          ? (error as { response?: { data?: { error?: string; message?: string } } }).response?.data
          : undefined;
      toast({
        title: 'Error',
        description: responseError?.error || responseError?.message || 'Failed to add topic',
        variant: 'destructive',
      });
    }
  };

  const handleVote = async (topicId: string) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to vote on topics',
        variant: 'destructive',
      });
      return;
    }

    try {
      await voteTopic.mutateAsync(topicId);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to vote on topic',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (topicId: string) => {
    if (!confirm('Are you sure you want to delete this topic?')) return;

    try {
      await deleteTopic.mutateAsync(topicId);
      toast({
        title: 'Success',
        description: 'Topic deleted successfully',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete topic',
        variant: 'destructive',
      });
    }
  };

  const renderTopic = (topic: ModuleTopic, level: number = 0) => {
    const isOwner = user?.id === topic.submittedBy;
    const hasChildren = topic.children && topic.children.length > 0;

    return (
      <div key={topic.id} className={`${level > 0 ? 'ml-6 mt-2' : 'mt-3'}`}>
        <div className={`flex items-start justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors ${
          level === 0 ? 'bg-background' : 'bg-muted/10'
        }`}>
          <div className="flex-1">
            {/* Topic header with name and metadata */}
            <div className="flex items-start gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <h4 className={`font-medium ${level === 0 ? 'text-base' : 'text-sm'} ${
                  level > 0 ? 'text-muted-foreground' : ''
                }`}>
                  {level > 0 && <span className="text-muted-foreground/60 mr-2">↳</span>}
                  {topic.name}
                </h4>
              </div>
              
              {/* Week and Duration badges */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {topic.weekTaught !== null && topic.weekTaught !== undefined && (
                  <Badge variant="secondary" className="text-xs font-normal">
                    Week {topic.weekTaught}
                  </Badge>
                )}
                {topic.duration && (
                  <Badge variant="outline" className="text-xs font-normal">
                    {topic.duration}
                  </Badge>
                )}
              </div>
            </div>

            {/* Subtopics indicator */}
            {hasChildren && level === 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {topic.children!.length} subtopic{topic.children!.length !== 1 ? 's' : ''}
              </p>
            )}

            {/* Author and voting section */}
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span className="text-xs">by {topic.user.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVote(topic.id)}
                className="h-7 px-2 gap-1.5 text-xs hover:bg-primary/10"
              >
                <ChevronUp className="h-3.5 w-3.5" />
                <span className="font-medium">{topic.upvotes}</span>
              </Button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-1 ml-2">
            {user && !selectedParent && level === 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedParent(topic.id)}
                title="Add subtopic"
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(topic.id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                title="Delete topic"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Render children with visual connection */}
        {hasChildren && (
          <div className="relative mt-1 space-y-1">
            {/* Vertical line to connect subtopics */}
            {level === 0 && (
              <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
            )}
            <div className="relative">
              {topic.children!.map((child) => renderTopic(child, level + 1))}
            </div>
          </div>
        )}

        {/* Add subtopic form */}
        {selectedParent === topic.id && (
          <div className="ml-6 mt-2 p-4 border rounded-lg bg-accent/30 border-accent">
            <h5 className="text-sm font-medium mb-3">Add Subtopic</h5>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Subtopic Name *</Label>
                <Input
                  placeholder="e.g., Process Scheduling Algorithms"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Week Taught</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 3"
                    value={newTopicWeek}
                    onChange={(e) => setNewTopicWeek(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Duration</Label>
                  <Input
                    placeholder="e.g., 1 week"
                    value={newTopicDuration}
                    onChange={(e) => setNewTopicDuration(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={handleAddTopic} disabled={createTopic.isPending}>
                  <Check className="h-4 w-4 mr-1" />
                  Add Subtopic
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedParent(null);
                    setNewTopicName('');
                    setNewTopicDuration('');
                    setNewTopicWeek('');
                    setNewSuggestedEdit('');
                    setNewEditReason('');
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground">Loading topics...</p>
        </CardContent>
      </Card>
    );
  }

  const topics = topicsData?.topics || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Topics Covered</CardTitle>
            <CardDescription>Course content submitted by students</CardDescription>
          </div>
          {user && !selectedParent && (
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Topic
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Topic Form */}
        {showAddForm && !selectedParent && (
          <div className="border rounded-lg p-4 space-y-4 bg-accent/30 border-accent">
            <h3 className="font-semibold text-base">Add New Topic</h3>
            <div>
              <Label className="text-sm font-medium">Topic Name *</Label>
              <Input
                placeholder="e.g., Process Management"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium">Week Taught</Label>
                <Input
                  type="number"
                  placeholder="e.g., 3"
                  value={newTopicWeek}
                  onChange={(e) => setNewTopicWeek(e.target.value)}
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Which week was this taught?
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Duration</Label>
                <Input
                  placeholder="e.g., 2 weeks"
                  value={newTopicDuration}
                  onChange={(e) => setNewTopicDuration(e.target.value)}
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  How long was this covered?
                </p>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Suggest Edit to Existing Topic (Optional)</Label>
              <Textarea
                placeholder="If suggesting changes to an existing topic, describe the edit here"
                value={newSuggestedEdit}
                onChange={(e) => setNewSuggestedEdit(e.target.value)}
                rows={2}
                className="mt-1.5"
              />
            </div>
            {newSuggestedEdit && (
              <div>
                <Label className="text-sm font-medium">Reason for Edit</Label>
                <Input
                  placeholder="Why is this edit needed?"
                  value={newEditReason}
                  onChange={(e) => setNewEditReason(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button onClick={handleAddTopic} disabled={createTopic.isPending}>
                {createTopic.isPending ? 'Adding...' : 'Add Topic'}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Topics List */}
        {topics.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground font-medium">No Topics Yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Be the first to contribute course content!
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {topics.map((topic) => renderTopic(topic))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
