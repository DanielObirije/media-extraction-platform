resource "aws_nat_gateway" "nat" {
    depends_on = "vpc"
    tags = {
      Name = "${var.project_name}_ngw_eip"
    }
}

resource "aws_nat_gateway" "main" {
   allocation_id = aws_nat_gateway.nat.id
   subnet_id = aws_subnet.server_subnet.id
   tags = {
      Name = "${var.project_name}_ngw"
  }
  depends_on = [ aws_internet_gateway.main ]
}