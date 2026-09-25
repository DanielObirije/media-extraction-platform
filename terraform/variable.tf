variable "vpc_cidr"{
    description = "VPC CIDIR"
    type = string
    default = "10.0.0.0/16"
}

variable "project_name"{
    description = "Name of the project"
    type = string
    default = "media-extraction-platform"
}

variable "subnet_cidir" {
    description = "Subnet cdir "
    type = object({
      client = list(string)
      server = list(string)
      database = list(string) 
    })

    default = {
        client = [
          "10.0.1.0/24",
          ]
        
        database = [
          "10.0.11.0/24",
        ]

        server = [
          "10.0.21.0/24",
        ]
    }
}

variable "availability_zones" {
  description = "Availability zones"
  type = list(string)
  default = [ "us-east-1a","us-east-1b" ]
}