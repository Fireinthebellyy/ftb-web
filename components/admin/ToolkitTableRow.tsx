"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  FileText,
} from "lucide-react";
import { Toolkit } from "./types";

interface ToolkitTableRowProps {
  toolkit: Toolkit;
  onEdit: (toolkit: Toolkit) => void;
  onDelete: (id: string, title: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onManageContent: (toolkit: Toolkit) => void;
}

export function ToolkitTableRow({
  toolkit,
  onEdit,
  onDelete,
  onToggleActive,
  onManageContent,
}: ToolkitTableRowProps) {
  return (
    <TableRow key={toolkit.id}>
      <TableCell className="max-w-xs">
        <div className="truncate font-medium">{toolkit.title}</div>
        <div className="text-muted-foreground truncate text-sm">
          {toolkit.description}
        </div>
      </TableCell>
      <TableCell>
        {toolkit.category && (
          <Badge variant="secondary">{toolkit.category}</Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">₹{toolkit.price}</span>
          {toolkit.originalPrice && (
            <span className="text-muted-foreground text-sm line-through">
              ₹{toolkit.originalPrice}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>{toolkit.lessonCount || 0}</TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleActive(toolkit.id, !toolkit.isActive)}
        >
          {toolkit.isActive ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </Button>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onManageContent(toolkit)}>
              <FileText className="mr-2 h-4 w-4" />
              Manage Content
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(toolkit)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(toolkit.id, toolkit.title)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
