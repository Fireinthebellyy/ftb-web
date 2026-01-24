"use client";

import { FormField, FormItem, FormControl, FormLabel, FormMessage } from "@/components/ui/form";
import { Control } from "react-hook-form";
import { InternshipFormData } from "../schema";
import { LogoUpload } from "../images/LogoUpload";
import { FileItem } from "@/types/interfaces";

type Props = {
  control: Control<InternshipFormData>;
  logoFile: FileItem | null;
  setLogoFile: (file: FileItem | null) => void;
  existingLogoUrl?: string | null;
  onRemoveExisting?: () => void;
};

export function PosterField({ 
  control, 
  logoFile, 
  setLogoFile, 
  existingLogoUrl,
  onRemoveExisting 
}: Props) {
  return (
    <FormField
      control={control}
      name="poster"
      render={({ field }) => {
        // Determine the existing logo URL
        const currentPosterValue = field.value;
        const displayLogoUrl = existingLogoUrl || (currentPosterValue && !currentPosterValue.startsWith("blob:") ? currentPosterValue : null);

        return (
        <FormItem>
            <FormLabel>Company Logo *</FormLabel>
          <FormControl>
              <LogoUpload
                file={logoFile}
                setFile={(file) => {
                  setLogoFile(file);
                  // Update form field immediately when file is selected
                  if (file && file.preview) {
                    field.onChange(file.preview);
                  } else if (!file) {
                    // If removing file and no existing URL, clear the field
                    if (!existingLogoUrl) {
                      field.onChange("");
                    }
                  }
                }}
                existingLogoUrl={displayLogoUrl}
                onRemoveExisting={() => {
                  field.onChange("");
                  setLogoFile(null);
                  if (onRemoveExisting) onRemoveExisting();
                }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
        );
      }}
    />
  );
}
