import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Task } from "@/types/interfaces";

export type TasksResponse = {
  tasks: Task[];
};

export type CreateTaskData = {
  title: string;
  description?: string;
};

export type UpdateTaskData = {
  id: string;
  title?: string;
  description?: string;
  opportunityLink?: string;
  completed?: boolean;
};

export async function fetchTasks(): Promise<Task[]> {
  const { data } = await axios.get<TasksResponse>("/api/tasks");
  return data.tasks;
}

export function useTasks(options?: { enabled?: boolean }) {
  return useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: CreateTaskData) => {
      const { data } = await axios.post("/api/tasks", taskData);
      return data.task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error) => {
      console.error("Error creating task:", error);
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData: UpdateTaskData) => {
      const { data } = await axios.put(`/api/tasks/${taskData.id}`, taskData);
      return data.task;
    },
    onMutate: async (taskData) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          ["tasks"],
          previousTasks.map((task) =>
            task.id === taskData.id ? { ...task, ...taskData } : task
          )
        );
      }

      return { previousTasks, updatingTaskId: taskData.id };
    },
    onError: (error, taskData, context) => {
      console.error("Error updating task:", error);
      if (context?.previousTasks) {
        queryClient.setQueryData<Task[]>(["tasks"], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { data } = await axios.delete(`/api/tasks/${taskId}`);
      return data.success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error) => {
      console.error("Error deleting task:", error);
    },
  });
}
