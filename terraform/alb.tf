resource "aws_alb" "main" {
  name = "application load balancer"
  internal = false
  load_balancer_type = "application"
  security_groups = aws_security_group.web_sg.id
  subnets = aws_subnet.web_subnet.id
  tags = {
    Name = "${var.project_name}-alb"
  }
}

resource "aws_alb_target_group" "app" {
  name = "app-target-group"
  port = 3000
  protocol = "HTTP"
  target_type = "instance"
  vpc_id = aws_vpc.main.id

  health_check {
    enabled = true
    path = "/health"
    protocol = "HTTP"
    port = 3000
    healthy_threshold = 3
    unhealthy_threshold = 2
    timeout = 5
    interval = 30
    matcher = "200"
  }
}

resource "aws_alb_listener" "http" {
   load_balancer_arn = aws_alb.main.arn
   port = 80
   protocol = "HTTP"

   default_action {
     type = "forward"
     target_group_arn = aws_alb_target_group.app.arn
   }
}