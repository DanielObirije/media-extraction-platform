resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr
  enable_dns_support = true
  enable_dns_hostnames = true
  tags = {
    Name = "${var.project_name}_vpc"
  }
}

resource "aws_internet_gateway" "main" {
   vpc_id = aws_vpc.main.id
   tags = {
     Name = "${var.project_name}_igw"
   }
}

resource "aws_subnet" "web_subnet" {
  vpc_id = aws_vpc.main
  cidr_block = var.subnet_cidir.client
  map_public_ip_on_launch = true
  tags = {
     Name = "${var.project_name}_web_sb"
   }
}

resource "aws_route_table" "web_rt" {
  vpc_id = aws_vpc.main.id
  route{
   cidr_block = "0.0.0.0/0"
   gateway_id = aws_internet_gateway.main
  }
  tags = {
    Name = "${var.project_name}_web_rt"
  }
}

resource "aws_route_table_association" "web_rta" {
  subnet_id = aws_subnet.web_subnet.id
  route_table_id = aws_route_table.web_rt.id
}


resource "aws_subnet" "server_subnet" {
  vpc_id = aws_vpc.main
  cidr_block = var.subnet_cidir.server
  map_public_ip_on_launch = false
  tags = {
     Name = "${var.project_name}_server_sb"
   }
}

resource "aws_route_table" "server_rt" {
  vpc_id = aws_vpc.main.id
  route  {
    cidr_block = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }
  tags = {
    Name = "${var.project_name}_server_rt"
  }
}


resource "aws_route_table_association" "server_rta" {
  subnet_id = aws_subnet.server_subnet.id
  route_table_id = aws_route_table.server_rt.id
}

