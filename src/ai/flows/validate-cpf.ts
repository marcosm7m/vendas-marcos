//Validate CPF
'use server';
/**
 * @fileOverview Validates the format of a CPF (Brazilian individual taxpayer registry number).
 *
 * - validateCpf - A function that validates the CPF format.
 * - ValidateCpfInput - The input type for the validateCpf function.
 * - ValidateCpfOutput - The return type for the validateCpf function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateCpfInputSchema = z.object({
  cpf: z.string().describe('The CPF to validate.'),
});
export type ValidateCpfInput = z.infer<typeof ValidateCpfInputSchema>;

const ValidateCpfOutputSchema = z.object({
  isValid: z.boolean().describe('Whether the CPF is valid or not based on its format.'),
});
export type ValidateCpfOutput = z.infer<typeof ValidateCpfOutputSchema>;

export async function validateCpf(input: ValidateCpfInput): Promise<ValidateCpfOutput> {
  return validateCpfFlow(input);
}

const validateCpfPrompt = ai.definePrompt({
  name: 'validateCpfPrompt',
  input: {schema: ValidateCpfInputSchema},
  output: {schema: ValidateCpfOutputSchema},
  prompt: `You are a CPF validator. Check if the given CPF has a valid format. CPF: {{{cpf}}}`,
});

const validateCpfFlow = ai.defineFlow(
  {
    name: 'validateCpfFlow',
    inputSchema: ValidateCpfInputSchema,
    outputSchema: ValidateCpfOutputSchema,
  },
  async input => {
    const {output} = await validateCpfPrompt(input);
    return output!;
  }
);
