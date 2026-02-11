variable "aws_region" {
  description = "AWS region for infrastructure resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Friendly name used to tag shared resources"
  type        = string
  default     = "green-field-exchange"
}
