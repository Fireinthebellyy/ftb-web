"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Circle, SquareArrowOutUpRight, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
} from "@/lib/queries";

export default function TaskWidget() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskDescription, setEditTaskDescription] = useState("");
  const [editTaskOpportunityLink, setEditTaskOpportunityLink] = useState("");

  const { data: tasks = [], isLoading, error } = useTasks();

  const { mutate: createTask, isPending: isCreating } = useCreateTask();
  const {
    mutate: updateTask,
    isPending: isUpdating,
    variables,
  } = useUpdateTask();
  const { mutate: deleteTask } = useDeleteTask();

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;

    createTask(
      {
        title: newTaskTitle,
        description: newTaskDescription,
      },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
          setNewTaskTitle("");
          setNewTaskDescription("");
        },
      }
    );
  };

  return (
    <div className="rounded-lg border bg-white px-4 py-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Tasks</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={isLoading}>
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>Add a new task to your list</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Title</label>
                <Input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Task title"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Description
                </label>
                <Textarea
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Task description (optional)"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateTask} disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Task"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-1 text-sm text-red-600">
          Failed to load tasks. Please try again.
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-gray-200"></div>
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200"></div>
          <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200"></div>
        </div>
      ) : (
        <div className="max-h-68 space-y-2 overflow-y-auto pb-2">
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2 rounded px-2 hover:bg-gray-50"
              >
                <div className="flex items-center">
                  {isUpdating && variables?.id === task.id ? (
                    <div className="size-3 animate-spin rounded-full border border-gray-300 border-t-blue-600" />
                  ) : (
                    <Circle
                      onClick={() =>
                        !isUpdating &&
                        updateTask({
                          id: task.id,
                          completed: !task.completed,
                        })
                      }
                      className={`size-3 cursor-pointer ${
                        task.completed
                          ? "text-blue-600"
                          : "text-gray-300 hover:text-gray-500"
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${task.completed ? "text-gray-400 line-through" : ""}`}
                  >
                    {task.title}
                  </p>
                </div>
                <div className="flex gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            setEditingTask(task);
                            setEditTaskTitle(task.title);
                            setEditTaskDescription(task.description || "");
                            setEditTaskOpportunityLink(
                              task.opportunityLink || ""
                            );
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <SquareArrowOutUpRight className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Expand task</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => deleteTask(task.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete task</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">
              No tasks yet. Create your first task!
            </p>
          )}
        </div>
      )}

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update your task details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Title</label>
              <Input
                value={editTaskTitle}
                onChange={(e) => setEditTaskTitle(e.target.value)}
                placeholder="Task title"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Description
              </label>
              <Textarea
                value={editTaskDescription}
                onChange={(e) => setEditTaskDescription(e.target.value)}
                placeholder="Task description (optional)"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Related Opportunity Link
              </label>
              <Input
                value={editTaskOpportunityLink}
                onChange={(e) => setEditTaskOpportunityLink(e.target.value)}
                placeholder="https://example.com/opportunity"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                disabled={isUpdating}
                onClick={() => {
                  if (editingTask && editTaskTitle.trim()) {
                    updateTask(
                      {
                        id: editingTask.id,
                        title: editTaskTitle,
                        description: editTaskDescription,
                        opportunityLink: editTaskOpportunityLink,
                      },
                      {
                        onSuccess: () => {
                          setIsEditDialogOpen(false);
                          setEditingTask(null);
                          setEditTaskTitle("");
                          setEditTaskDescription("");
                          setEditTaskOpportunityLink("");
                        },
                      }
                    );
                  }
                }}
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
