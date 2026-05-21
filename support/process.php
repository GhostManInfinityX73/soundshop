<?php
header('Content-Type: application/json'); 
$rawJson = file_get_contents('php://input');
$data = json_decode($rawJson, true); 

if (!$data || !isset($data['message'])) {
    echo json_encode(["status" => "error", "error" => "No JSON data received"]);
    exit; 
}

$message = stripslashes($data['message']); 
$toAdminEmail = "streetmentalityrecords1973@gmail.com"; 
$toSmsPhone = "19105499227@mms.cricketwireless.net"; 
$recipients = $toAdminEmail . ", " . $toSmsPhone;

$subject = "SITE NOTIFICATION: New Sound Shop Chat Alert";
$headers = "From: Sound Shop Webmaster <webmaster@soundshop.com>\r\n" .
           "Reply-To: no-reply@soundshop.com\r\n" .
           "MIME-Version: 1.0\r\n" .
           "Content-Type: text/plain; charset=UTF-8\r\n" .
           "X-Mailer: PHP/" . phpversion();

$success = mail($recipients, $subject, $message, $headers);

if ($success) {
    echo json_encode(["status" => "success"]);
} else {
    echo json_encode(["status" => "error", "error" => "PHP mail() function failed."]);
}
?>
