resource "aws_security_group" "web_sg" {
  name = "WebPubSG"
  description = "Security group for web tier"
  vpc_id = aws_vpc.main.id

  ingress {
    
  }

  tags = {
    Name = "${var.project_name}-web-sg"
  }
}