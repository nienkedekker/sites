"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import CardHead from "@nienke/ui/card-head";

import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { formStyles } from "@/utils/styles";

import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/utils/schemas/validation";
import { changePasswordAction } from "@/app/actions/auth";

export function ChangePasswordForm() {
  const [changed, setChanged] = useState(false);

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });

  const onSubmit = async (data: ChangePasswordInput) => {
    setChanged(false);

    const formData = new FormData();
    formData.append("password", data.password);
    formData.append("confirm", data.confirm);

    const res = await changePasswordAction(formData);

    if (!res.ok) {
      form.setError("root", { message: res.error });
      return;
    }

    form.reset();
    setChanged(true);
  };

  const {
    handleSubmit,
    control,
    formState: { isSubmitting, errors },
  } = form;

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={`${formStyles.container} space-y-6`}
      >
        <CardHead>Change password</CardHead>

        {errors.root?.message && (
          <FormMessage role="alert">{errors.root.message}</FormMessage>
        )}
        {changed && (
          <FormMessage className="text-ink" role="status">
            Password changed. Other devices are signed out.
          </FormMessage>
        )}

        <FormField
          control={control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="confirm"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Repeat new password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <SubmitButton pendingText="Changing..." isSubmitting={isSubmitting}>
          Change password
        </SubmitButton>
      </form>
    </Form>
  );
}
